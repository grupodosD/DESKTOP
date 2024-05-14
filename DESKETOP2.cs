using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace RoyalPalace
{
    public partial class DESKETOP2 : Form
    {
        public DESKETOP2()
        {
            InitializeComponent();
        }

        private void PictureBox1_Click(object sender, EventArgs e)
        {

        }

        private void Button1_Click(object sender, EventArgs e)
        {
            DESKETOP3 Calculadora_3 = new DESKETOP3();
            Calculadora_3.Show();
        }
    }
}
